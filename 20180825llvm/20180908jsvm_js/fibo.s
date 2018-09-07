	.section	__TEXT,__text,regular,pure_instructions
	.macosx_version_min 10, 13
	.section	__TEXT,__literal8,8byte_literals
	.p2align	3               ## -- Begin function fibo
LCPI0_0:
	.quad	4611686018427387904     ## double 2
LCPI0_1:
	.quad	4607182418800017408     ## double 1
LCPI0_2:
	.quad	-4616189618054758400    ## double -1
LCPI0_3:
	.quad	-4611686018427387904    ## double -2
	.section	__TEXT,__text,regular,pure_instructions
	.globl	_fibo
	.p2align	4, 0x90
_fibo:                                  ## @fibo
	.cfi_startproc
## %bb.0:                               ## %entry
	subq	$24, %rsp
	.cfi_def_cfa_offset 32
	movapd	%xmm0, %xmm2
	movsd	LCPI0_0(%rip), %xmm0    ## xmm0 = mem[0],zero
	cmpnltsd	%xmm2, %xmm0
	movsd	LCPI0_1(%rip), %xmm1    ## xmm1 = mem[0],zero
	andpd	%xmm0, %xmm1
	xorpd	%xmm0, %xmm0
	ucomisd	%xmm0, %xmm1
	je	LBB0_2
## %bb.1:                               ## %then
	movsd	LCPI0_1(%rip), %xmm0    ## xmm0 = mem[0],zero
	addq	$24, %rsp
	retq
LBB0_2:                                 ## %ifcont
	movsd	LCPI0_2(%rip), %xmm0    ## xmm0 = mem[0],zero
	addsd	%xmm2, %xmm0
	movsd	%xmm2, 8(%rsp)          ## 8-byte Spill
	callq	_fibo
	movsd	%xmm0, 16(%rsp)         ## 8-byte Spill
	movsd	8(%rsp), %xmm0          ## 8-byte Reload
                                        ## xmm0 = mem[0],zero
	addsd	LCPI0_3(%rip), %xmm0
	callq	_fibo
	addsd	16(%rsp), %xmm0         ## 8-byte Folded Reload
	addq	$24, %rsp
	retq
	.cfi_endproc
                                        ## -- End function
	.section	__TEXT,__literal8,8byte_literals
	.p2align	3               ## -- Begin function main
LCPI1_0:
	.quad	4621256167635550208     ## double 9
	.section	__TEXT,__text,regular,pure_instructions
	.globl	_main
	.p2align	4, 0x90
_main:                                  ## @main
	.cfi_startproc
## %bb.0:                               ## %entry
	pushq	%rax
	.cfi_def_cfa_offset 16
	movsd	LCPI1_0(%rip), %xmm0    ## xmm0 = mem[0],zero
	callq	_fibo
	callq	_printDouble
	popq	%rax
	retq
	.cfi_endproc
                                        ## -- End function

.subsections_via_symbols
